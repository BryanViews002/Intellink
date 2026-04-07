import { BankDetailsForm } from "@/components/dashboard/BankDetailsForm";
import { getBankDetailsPageData, requireDashboardUser } from "@/lib/data";

export default async function DashboardBankDetailsPage() {
  const { profile } = await requireDashboardUser();
  const data = await getBankDetailsPageData(profile.id);

  if (!data) {
    return null;
  }

  return (
    <main className="section-shell page-enter py-8">
      <BankDetailsForm
        banks={data.banks}
        initialValues={{
          bank_code: data.profile.bank_code,
          bank_account: data.profile.bank_account,
          account_name: data.profile.account_name,
          korapay_recipient_verified: data.profile.korapay_recipient_verified,
        }}
      />
    </main>
  );
}
