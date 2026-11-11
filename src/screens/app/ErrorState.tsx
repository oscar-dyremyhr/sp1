import { Button, EmptyState } from "@/design-system/components";
import { copy } from "@/content/copy";

/** Friendly error: says what happened and what to do next. */
export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <EmptyState
      mood="sleepy"
      title={copy.common.errorTitle}
      body={message ?? copy.common.errorBody}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            {copy.common.tryAgain}
          </Button>
        ) : undefined
      }
    />
  );
}
