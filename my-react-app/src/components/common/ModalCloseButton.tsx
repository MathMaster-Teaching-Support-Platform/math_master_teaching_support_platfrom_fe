import { X } from 'lucide-react';

type Props = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
};

export default function ModalCloseButton({ onClick, ariaLabel = 'Đóng' }: Readonly<Props>) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="w-8 h-8 p-0 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] hover:bg-[#D1CFC5] transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
