import prisma from "@/lib/prisma";
import { BlinkBlur } from "react-loading-indicators";

export default async function LoadingPage() {
  const colors = await prisma.appSettings.findFirst({
    where: {
      key: "theme_primary_color",
    },
  });
  const primaryColor = colors?.value || "#32cd32";
  return (
    <div>
      <BlinkBlur color={primaryColor} size="medium" text="" textColor="" />
    </div>
  );
}
