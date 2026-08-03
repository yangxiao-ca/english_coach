import { ItemsList } from "@/components/ItemsList";

export default function LibraryPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-black">学习库</h1>
      <ItemsList mode="library" />
    </div>
  );
}
