/**
 * TranslationSelector - Dropdown for selecting Bible translation
 */

import { BibleTranslation } from '@/types/bible';
import { TRANSLATIONS } from '@/lib/bible/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TranslationSelectorProps {
  selectedTranslation: string;
  onSelectTranslation: (translationId: string) => void;
  className?: string;
}

export function TranslationSelector({
  selectedTranslation,
  onSelectTranslation,
  className,
}: TranslationSelectorProps) {
  return (
    <Select value={selectedTranslation} onValueChange={onSelectTranslation}>
      <SelectTrigger className={cn("w-[140px] h-8", className)}>
        <SelectValue placeholder="Translation" />
      </SelectTrigger>
      <SelectContent>
        {TRANSLATIONS.map((translation) => (
          <SelectItem key={translation.id} value={translation.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{translation.shortName}</span>
              {translation.includesDeuterocanon && (
                <span className="text-xs text-muted-foreground">+DC</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
