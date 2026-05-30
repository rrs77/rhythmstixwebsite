import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBasket } from "@/contexts/BasketContext";
import { validateVoucher } from "@/hooks/use-shop";
import { Loader2, Tag, X } from "lucide-react";

interface Props {
  className?: string;
}

export function VoucherInput({ className = "" }: Props) {
  const { subtotal, voucher, applyVoucher, clearVoucher } = useBasket();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const v = await validateVoucher(trimmed, subtotal);
      applyVoucher({
        code: v.code,
        discountType: v.discountType,
        discountValue: v.discountType === "fixed" ? v.discountValue / 100 : v.discountValue,
        minimumOrderValue: v.minimumOrderValue,
        discount: v.discount,
      });
      setCode("");
    } catch (err: any) {
      setError(err?.message || "Voucher could not be applied");
    } finally {
      setSubmitting(false);
    }
  };

  if (voucher) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg border border-[#3a9ca5]/30 bg-[#3a9ca5]/5 px-3 py-2 ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="w-4 h-4 text-[#3a9ca5] shrink-0" />
          <div className="text-sm min-w-0">
            <p className="font-semibold text-foreground truncate">{voucher.code}</p>
            <p className="text-xs text-muted-foreground">
              {voucher.discountType === "percentage"
                ? `${voucher.discountValue}% off`
                : `£${voucher.discountValue.toFixed(2)} off`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearVoucher}
          className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
          aria-label="Remove voucher"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className={className}>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Voucher code"
          className="flex-grow uppercase tracking-wide"
          maxLength={64}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={submitting || !code.trim() || subtotal === 0}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </form>
  );
}
