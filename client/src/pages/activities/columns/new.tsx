import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import { ActivityService } from "@/services/activity.service";

type ColumnsNewProps = {
	orgId: number;
	nextOrderIndex: number;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
};

export default function ColumnsNew({
	orgId,
	nextOrderIndex,
	onClose,
	onSaved,
}: ColumnsNewProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		color: "#f3f4f6",
	});

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error("Nome da coluna é obrigatório");
			return;
		}

		try {
			setIsSaving(true);
			await ActivityService.createColumn(
				orgId,
				formData.name,
				nextOrderIndex,
				formData.color,
				false
			);
			toast.success("Coluna criada");
			await onSaved();
			onClose();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Erro ao salvar coluna";
			toast.error(msg);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<Card className="w-96">
				<CardHeader>
					<CardTitle>Nova Coluna</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-2">
							Nome da Coluna
						</label>
						<Input
							value={formData.name}
							onChange={e => setFormData({ ...formData, name: e.target.value })}
							placeholder="Ex: Revisão, Bloqueado, etc"
							disabled={isSaving}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Cor</label>
						<div className="flex gap-3">
							<input
								type="color"
								value={formData.color}
								onChange={e =>
									setFormData({ ...formData, color: e.target.value })
								}
								className="w-12 h-10 border rounded cursor-pointer"
								disabled={isSaving}
							/>
							<div
								className="flex-1 border rounded"
								style={{ backgroundColor: formData.color }}
							/>
						</div>
					</div>

					<div className="flex gap-2">
						<Button onClick={handleSave} className="flex-1" disabled={isSaving}>
							Salvar
						</Button>
						<Button
							onClick={onClose}
							variant="outline"
							className="flex-1"
							disabled={isSaving}
						>
							Cancelar
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
