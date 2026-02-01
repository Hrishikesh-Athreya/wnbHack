"""
Pre-call research service using Browserbase for web scraping.
Gathers intelligence about prospects and companies before calls.
"""

import os
from typing import Optional
from loguru import logger
from playwright.async_api import async_playwright
from browserbase import Browserbase

from app.config import get_settings


class ResearchService:
    """
    Service for gathering pre-call intelligence using Browserbase.
    Scrapes LinkedIn profiles and company websites.
    """
    
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.browserbase_api_key
        self.project_id = settings.browserbase_project_id
        self.bb = None
        
        if self.api_key and self.project_id:
            self.bb = Browserbase(api_key=self.api_key)
            logger.info("Browserbase research service initialized")
        else:
            logger.warning("Browserbase credentials not configured, research disabled")
    
    def _is_configured(self) -> bool:
        """Check if Browserbase is configured."""
        return self.bb is not None
    
    async def research_prospect(
        self,
        person_name: Optional[str] = None,
        linkedin_url: Optional[str] = None,
        company_name: Optional[str] = None,
        company_website: Optional[str] = None
    ) -> dict:
        """
        Perform comprehensive pre-call research on a prospect.
        
        Args:
            person_name: Name of the person to research
            linkedin_url: LinkedIn profile URL
            company_name: Name of the company
            company_website: Company website URL
            
        Returns:
            Dictionary with research findings
        """
        research = {
            "person": None,
            "company": None,
            "talking_points": [],
            "potential_objections": [],
            "summary": ""
        }
        
        if not self._is_configured():
            logger.warning("Browserbase not configured, skipping research")
            return research
        
        try:
            # Research person if LinkedIn URL provided
            if linkedin_url:
                research["person"] = await self._scrape_linkedin(linkedin_url)
            
            # Research company if website provided
            if company_website:
                research["company"] = await self._scrape_company_website(company_website)
            elif company_name:
                # Try to find company info via search
                research["company"] = await self._search_company(company_name)
            
            # Generate talking points and summary
            research["talking_points"] = self._generate_talking_points(research)
            research["summary"] = self._generate_summary(research, person_name, company_name)
            
            logger.info(f"Research completed for {person_name or 'unknown'} at {company_name or 'unknown'}")
            
        except Exception as e:
            logger.error(f"Research failed: {e}")
            research["summary"] = f"Research incomplete due to error: {str(e)}"
        
        return research
    
    async def _scrape_linkedin(self, linkedin_url: str) -> dict:
        """Scrape LinkedIn profile for person information."""
        logger.info(f"Scraping LinkedIn: {linkedin_url}")
        
        person_data = {
            "name": None,
            "title": None,
            "company": None,
            "location": None,
            "summary": None,
            "experience": [],
            "skills": []
        }
        
        try:
            session = self.bb.sessions.create(project_id=self.project_id)
            logger.info(f"Browserbase session: https://browserbase.com/sessions/{session.id}")
            
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(session.connect_url)
                context = browser.contexts[0]
                page = context.pages[0]
                
                await page.goto(linkedin_url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)  # Let page render
                
                # Extract profile information
                try:
                    name_el = await page.query_selector("h1.text-heading-xlarge")
                    if name_el:
                        person_data["name"] = await name_el.text_content()
                except:
                    pass
                
                try:
                    title_el = await page.query_selector("div.text-body-medium")
                    if title_el:
                        person_data["title"] = await title_el.text_content()
                except:
                    pass
                
                try:
                    location_el = await page.query_selector("span.text-body-small.inline")
                    if location_el:
                        person_data["location"] = await location_el.text_content()
                except:
                    pass
                
                # Get about/summary section
                try:
                    about_section = await page.query_selector("section:has(#about) div.display-flex span[aria-hidden='true']")
                    if about_section:
                        person_data["summary"] = await about_section.text_content()
                except:
                    pass
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"LinkedIn scrape failed: {e}")
        
        return person_data
    
    async def _scrape_company_website(self, website_url: str) -> dict:
        """Scrape company website for business information."""
        logger.info(f"Scraping company website: {website_url}")
        
        company_data = {
            "name": None,
            "description": None,
            "industry": None,
            "products": [],
            "about": None,
            "values": []
        }
        
        try:
            session = self.bb.sessions.create(project_id=self.project_id)
            
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(session.connect_url)
                context = browser.contexts[0]
                page = context.pages[0]
                
                # First get homepage
                await page.goto(website_url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                
                # Get page title as company name fallback
                company_data["name"] = await page.title()
                
                # Get meta description
                try:
                    meta_desc = await page.query_selector("meta[name='description']")
                    if meta_desc:
                        company_data["description"] = await meta_desc.get_attribute("content")
                except:
                    pass
                
                # Get main content/hero text
                try:
                    hero = await page.query_selector("h1")
                    if hero:
                        company_data["about"] = await hero.text_content()
                except:
                    pass
                
                # Try to find About page
                try:
                    about_link = await page.query_selector("a[href*='about']")
                    if about_link:
                        await about_link.click()
                        await page.wait_for_timeout(2000)
                        
                        # Get about page content
                        main_content = await page.query_selector("main, article, .content")
                        if main_content:
                            about_text = await main_content.text_content()
                            company_data["about"] = about_text[:1000] if about_text else None
                except:
                    pass
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Company website scrape failed: {e}")
        
        return company_data
    
    async def _search_company(self, company_name: str) -> dict:
        """Search for company information when no website provided."""
        logger.info(f"Searching for company: {company_name}")
        
        company_data = {
            "name": company_name,
            "description": None,
            "found_website": None
        }
        
        try:
            session = self.bb.sessions.create(project_id=self.project_id)
            
            async with async_playwright() as p:
                browser = await p.chromium.connect_over_cdp(session.connect_url)
                context = browser.contexts[0]
                page = context.pages[0]
                
                # Search on Google
                search_url = f"https://www.google.com/search?q={company_name}+company"
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                
                # Get first result description
                try:
                    first_result = await page.query_selector("div.VwiC3b")
                    if first_result:
                        company_data["description"] = await first_result.text_content()
                except:
                    pass
                
                # Get company website from results
                try:
                    first_link = await page.query_selector("div.g a[href^='http']")
                    if first_link:
                        company_data["found_website"] = await first_link.get_attribute("href")
                except:
                    pass
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Company search failed: {e}")
        
        return company_data
    
    def _generate_talking_points(self, research: dict) -> list:
        """Generate talking points based on research."""
        points = []
        
        person = research.get("person") or {}
        company = research.get("company") or {}
        
        if person.get("title"):
            points.append(f"Prospect's role: {person['title']}")
        
        if person.get("summary"):
            points.append(f"Background: {person['summary'][:200]}...")
        
        if company.get("description"):
            points.append(f"Company focus: {company['description'][:200]}...")
        
        if company.get("industry"):
            points.append(f"Industry: {company['industry']}")
        
        return points
    
    def _generate_summary(self, research: dict, person_name: str, company_name: str) -> str:
        """Generate a brief research summary for the agent."""
        parts = []
        
        person = research.get("person") or {}
        company = research.get("company") or {}
        
        if person_name:
            parts.append(f"Prospect: {person_name}")
            if person.get("title"):
                parts.append(f"Role: {person['title']}")
            if person.get("location"):
                parts.append(f"Location: {person['location']}")
        
        if company_name:
            parts.append(f"Company: {company_name}")
            if company.get("description"):
                parts.append(f"About: {company['description'][:300]}")
        
        if not parts:
            return "No research data available."
        
        return "\n".join(parts)


# Singleton instance
_research_service: Optional[ResearchService] = None


def get_research_service() -> ResearchService:
    """Get or create the research service singleton."""
    global _research_service
    if _research_service is None:
        _research_service = ResearchService()
    return _research_service


async def run_precall_research(call_id: str, call_state: dict) -> dict:
    """
    Background task to run pre-call research and update call state.
    
    Args:
        call_id: The call ID
        call_state: The initial call state with prospect info
        
    Returns:
        Research results dictionary
    """
    from app.services.redis_service import get_redis_service
    
    logger.info(f"Starting pre-call research for call {call_id}")
    
    research_service = get_research_service()
    redis_service = get_redis_service()
    await redis_service.connect()
    
    # Perform research
    research = await research_service.research_prospect(
        person_name=call_state.get("person_name"),
        linkedin_url=call_state.get("person_linkedin_url"),
        company_name=call_state.get("company_name"),
        company_website=call_state.get("company_website")
    )
    
    # Update call state with research
    current_state = await redis_service.get_call_state(call_id)
    if current_state:
        current_state["research"] = research
        await redis_service.set_call_state(call_id, current_state)
        logger.info(f"Research saved to call state for {call_id}")
    
    return research
