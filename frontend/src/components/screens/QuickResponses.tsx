interface QuickResponsesProps {
    responses: string[];
    onSelect: (response: string) => void;
    disabled?: boolean;
}

export function QuickResponses({ responses, onSelect, disabled }: QuickResponsesProps) {
    if (!responses.length) return null;

    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {responses.map((response, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(response)}
                    disabled={disabled}
                    className={`
            px-4 py-2 rounded-full border-2 border-primary/60
            text-primary font-medium text-sm
            hover:bg-primary/10 hover:border-primary
            transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
                >
                    {response}
                </button>
            ))}
        </div>
    );
}
