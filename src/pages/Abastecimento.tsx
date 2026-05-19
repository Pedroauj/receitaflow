import { Fuel } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

const Abastecimento = () => {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1560px]">
        <PageHeader
          badgeIcon={Fuel}
          badgeLabel="Abastecimento"
          title="Abastecimento"
          description=""
        />
      </div>
    </div>
  );
};

export default Abastecimento;
