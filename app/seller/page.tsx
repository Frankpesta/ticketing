import SellerDashboard from "@/components/seller-dashboard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const SellerPage = async () => {
	const { userId } = await auth();
	if (!userId) redirect("/");
	return (
		<div className="min-h-screen bg-gray-50">
			<SellerDashboard />
		</div>
	);
};

export default SellerPage;
