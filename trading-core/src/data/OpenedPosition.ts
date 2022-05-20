import { Share } from './share';

type OpenedPosition = Omit<Share, 'lotSize'|'quantity'>;

export default OpenedPosition;