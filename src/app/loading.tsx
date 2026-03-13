import { FullPageLoader } from "@/components/ui/loading-spinner";

export default function AppLoading() {
  return (
    <FullPageLoader
      title="Зареждаме приложението"
      subtitle="Подготвяме страницата и синхронизираме последните данни..."
    />
  );
}
