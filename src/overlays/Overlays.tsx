// Drawers, dialogs and the toast, layered over whichever view is open.
import { useApp } from '../app/store';
import { sx } from '../lib/sx';
import { IntegrationsDialog, LinkDialog, SaveArticleDialog, SourceDialog } from './Dialogs';
import { ArticleDrawer, CardDrawer, IssueDrawer } from './Drawers';

export function Overlays() {
  const { state, isMobile } = useApp();
  const toast = state.toast;
  return (
    <>
      {state.dirCard && <CardDrawer id={state.dirCard} />}
      {state.issue && <IssueDrawer identifier={state.issue} />}
      {state.article && <ArticleDrawer id={state.article} />}
      {state.dialog === 'save' && <SaveArticleDialog />}
      {state.dialog === 'integrations' && <IntegrationsDialog />}
      {state.dialog === 'link' && <LinkDialog />}
      {state.dialog === 'source' && <SourceDialog />}
      {toast && (
        <div role="status" style={sx('position:absolute; left:50%; transform:translateX(-50%); z-index:60; display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; background:var(--primary); color:var(--primary-foreground); font-size:13px; box-shadow:0 12px 40px rgb(0 0 0 / 0.2); white-space:nowrap;', { bottom: isMobile ? '80px' : '24px' })}>
          <span>{toast.msg}</span>
          {toast.run && <button type="button" onClick={toast.run} style={sx('border:0; background:transparent; font:inherit; font-weight:600; color:inherit; text-decoration:underline; cursor:pointer;')}>{toast.actionLabel}</button>}
        </div>
      )}
    </>
  );
}
