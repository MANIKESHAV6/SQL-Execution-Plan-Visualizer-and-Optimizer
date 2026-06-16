import { SAMPLE_QUERIES } from "@/lib/sql/samples";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  error?: string | null;
}

export function QueryEditor({ value, onChange, onRun, error }: Props) {
  return (
    <section className="panel p-5 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">SQL Query</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            SELECT · FROM · WHERE · INNER JOIN · GROUP BY · ORDER BY
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Load sample query"
            className="bg-input text-foreground border border-border rounded-md px-2 py-1.5 text-sm"
            defaultValue=""
            onChange={(e) => {
              const s = SAMPLE_QUERIES.find((q) => q.name === e.target.value);
              if (s) onChange(s.sql);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Load sample…
            </option>
            {SAMPLE_QUERIES.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={onRun}
            className="bg-primary text-primary-foreground hover:opacity-90 transition rounded-md px-4 py-1.5 text-sm font-semibold"
          >
            Analyze ▸
          </button>
        </div>
      </header>

      <textarea
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full resize-y font-mono text-sm leading-relaxed bg-[color:var(--input)] text-foreground border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2 font-mono">
          {error}
        </div>
      )}
    </section>
  );
}
