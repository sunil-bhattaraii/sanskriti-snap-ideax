import { COLORS } from '../../constants/colors';
import { getRarityInfo } from '../rarity';

describe('getRarityInfo', () => {
  it('labels 200+ XP as LEGENDARY', () => {
    expect(getRarityInfo(200).label).toBe('LEGENDARY');
    expect(getRarityInfo(500).label).toBe('LEGENDARY');
  });

  it('labels 150–199 XP as RARE', () => {
    expect(getRarityInfo(150).label).toBe('RARE');
    expect(getRarityInfo(199).label).toBe('RARE');
  });

  it('labels everything below 150 XP as COMMON', () => {
    expect(getRarityInfo(0).label).toBe('COMMON');
    expect(getRarityInfo(100).label).toBe('COMMON');
    expect(getRarityInfo(149).label).toBe('COMMON');
  });

  it('uses the boundary values deterministically and only once each', () => {
    // 150 is RARE, 149 is COMMON, 200 is LEGENDARY, 199 is RARE.
    const labels = [149, 150, 199, 200].map((xp) => getRarityInfo(xp).label);
    expect(labels).toEqual(['COMMON', 'RARE', 'RARE', 'LEGENDARY']);
  });

  it('returns color tokens present in the palette', () => {
    const common = getRarityInfo(10);
    const legendary = getRarityInfo(300);
    expect(common.color).toBe(COLORS.tertiary);
    expect(legendary.color).toBe(COLORS.primary);
    expect(getRarityInfo(160).color).toBe('#4299E1');
  });

  it('defaults a missing/undefined xp to COMMON', () => {
    expect(getRarityInfo(NaN).label).toBe('COMMON');
    expect(getRarityInfo(-1).label).toBe('COMMON');
  });
});