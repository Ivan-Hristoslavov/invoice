import { FullPageLoader } from "@/components/ui/loading-spinner";

export default function MainAppLoading() {
  return (
    <FullPageLoader
      title="Зареждаме страницата"
      subtitle="Изчакваме данните и подготвяме най-важното за вас..."
    />
  );
}
