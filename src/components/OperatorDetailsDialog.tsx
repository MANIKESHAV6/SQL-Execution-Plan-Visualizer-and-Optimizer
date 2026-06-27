// Educational popup shown when the user clicks an operator in the plan tree,
// or hovers one with Learning Mode enabled.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OPERATOR_INFO, type OperatorKey } from "@/lib/sql/operatorInfo";

interface Props {
  operator: OperatorKey | null;
  onClose: () => void;
}

export function OperatorDetailsDialog({ operator, onClose }: Props) {
  const info = operator ? OPERATOR_INFO[operator] : null;
  return (
    <Dialog open={!!info} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {info && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="op-chip" style={{ color: "var(--op-index)" }}>
                  {info.key}
                </span>
                <span className="op-chip text-muted-foreground">
                  {info.category}
                </span>
                <span className="op-chip" style={{ color: "var(--op-join)" }}>
                  {info.complexity}
                </span>
              </div>
              <DialogTitle className="text-2xl mt-2">{info.label}</DialogTitle>
              <DialogDescription className="text-base">
                {info.purpose}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 mt-3 text-sm">
              <Block title="Description">{info.description}</Block>

              <Block title="Example">
                <pre className="font-mono text-xs bg-muted/40 rounded-md p-3 whitespace-pre-wrap">
                  {info.example}
                </pre>
              </Block>

              <div className="grid sm:grid-cols-2 gap-3">
                <ListBlock
                  title="Advantages"
                  items={info.advantages}
                  color="var(--op-index)"
                />
                <ListBlock
                  title="Disadvantages"
                  items={info.disadvantages}
                  color="var(--op-filter)"
                />
              </div>

              <ListBlock title="Performance Tips" items={info.tips} color="var(--op-scan)" />

              <Block title="Real Database Behavior">{info.realWorld}</Block>

              <ListBlock
                title="Interview Questions"
                items={info.interview}
                color="var(--op-join)"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="panel p-3">
      <h4
        className="text-xs font-mono uppercase tracking-widest mb-2"
        style={{ color }}
      >
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span style={{ color }}>›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
