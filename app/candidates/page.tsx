import { ItemsList } from "@/components/ItemsList";

export default function CandidatesPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-black">候选 learning_items</h1>
      <ItemsList status="candidate" mode="candidate" />
    </div>
  );
}
