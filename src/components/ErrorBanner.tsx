import { SUPPORT_EMAIL, type UserFacingError } from "@/lib/api";
import Banner from "./Banner";

/** Error banner for a failed load: what went wrong, plus how to reach support with a reference. */
export default function ErrorBanner({ error }: { error: UserFacingError }) {
  const support = error.reference
    ? `If this keeps happening, email ${SUPPORT_EMAIL} and include reference ${error.reference}.`
    : `If this keeps happening, email ${SUPPORT_EMAIL}.`;

  return <Banner level="error" message={error.message} items={[support]} />;
}
