import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "../../services/api";
import { InventoryBalance } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { formatNumber } from "../../utils/formatters";

const adjustmentSchema = z.object({
  new_quantity: z.coerce.number().min(0, "Số lượng không được âm"),
  reason: z.string().min(1, "Vui lòng nhập lý do điều chỉnh"),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: InventoryBalance | null;
  onSuccess: () => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  isOpen,
  onClose,
  balance,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      new_quantity: balance ? Number(balance.quantity_on_hand) : 0,
      reason: "",
    },
  });

  React.useEffect(() => {
    if (balance) {
      reset({
        new_quantity: Number(balance.quantity_on_hand),
        reason: "",
      });
    }
  }, [balance, reset]);

  if (!balance) return null;

  const onSubmit = async (data: AdjustmentFormData) => {
    await api.post("/inventory/adjust", {
      warehouse_id: balance.warehouse_id,
      product_id: balance.product_id,
      new_quantity: data.new_quantity,
      reason: data.reason,
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Điều chỉnh số lượng tồn kho"
      description={`Cập nhật số lượng tồn thực tế cho sản phẩm ${balance.product?.name} tại ${balance.warehouse?.name}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
          <p className="text-slate-500">
            Tồn hiện tại trên hệ thống:{" "}
            <strong className="text-slate-900 font-bold">
              {formatNumber(balance.quantity_on_hand)}
            </strong>
          </p>
          <p className="text-slate-400">
            Mọi thay đổi sẽ được ghi vào nhật ký giao dịch kho bất biến (Inventory Transactions).
          </p>
        </div>

        <Input
          label="Số lượng thực tế mới *"
          type="number"
          step="any"
          error={errors.new_quantity?.message}
          {...register("new_quantity")}
        />

        <Input
          label="Lý do điều chỉnh *"
          placeholder="VD: Kiểm đếm sai lệch, vỡ hỏng..."
          error={errors.reason?.message}
          {...register("reason")}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Xác nhận điều chỉnh
          </Button>
        </div>
      </form>
    </Modal>
  );
};

