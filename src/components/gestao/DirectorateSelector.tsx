import { useDirectorate } from '@/contexts/DirectorateContext';
import { DIRECTORATES } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function DirectorateSelector() {
  const { selectedDirectorate, setSelectedDirectorate } = useDirectorate();

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <Label htmlFor="directorate" className="text-sm font-medium whitespace-nowrap">
        Diretoria:
      </Label>
      <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
        <SelectTrigger id="directorate" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DIRECTORATES.map((dir) => (
            <SelectItem key={dir.value} value={dir.value}>
              {dir.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}