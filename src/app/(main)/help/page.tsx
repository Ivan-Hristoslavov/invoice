import { Metadata } from "next";
import { HelpCenter } from "@/components/help/HelpCenter";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Помощ и поддръжка | ${APP_NAME}`,
  description: `Помощ, често задавани въпроси и връзки към документацията за ${APP_NAME}`,
};

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <HelpCenter />
    </div>
  );
}
