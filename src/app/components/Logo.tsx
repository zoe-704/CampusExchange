// Reusable Campus Exchange Logo component
import logoImage from "@/assets/31ce0516c5378e034a65427d8905fa6e35b3a6ed.png";

export function Logo({ size = 60 }: { size?: number }) {
  return (
    <img 
      src={logoImage} 
      alt="Campus Exchange Logo" 
      width={size} 
      height={size}
      className="object-contain"
    />
  );
}