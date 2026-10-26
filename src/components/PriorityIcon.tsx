import type { PriorityIconName } from '../rules/pdd';
import { ArrowDownIcon, ArrowUpIcon, DotsThreeIcon, MinusIcon, WarningIcon } from './ds';

const ICONS = { DotsThree: DotsThreeIcon, Warning: WarningIcon, ArrowUp: ArrowUpIcon, Minus: MinusIcon, ArrowDown: ArrowDownIcon };

export function PriorityIcon({ name, size = 14 }: { name: PriorityIconName; size?: number }) {
  const Icon = ICONS[name];
  return <Icon size={size} />;
}
