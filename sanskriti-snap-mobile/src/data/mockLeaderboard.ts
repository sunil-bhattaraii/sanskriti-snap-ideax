// src/data/mockLeaderboard.ts
export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  level: number;
  xp: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export const mockLeaderboardUsers: LeaderboardUser[] = [
  // --- TOP 3 FOR PODIUM ---
  {
    id: 'user_1',
    rank: 1,
    name: 'Ananya_Explores',
    level: 28,
    xp: 14200,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRL-A-htuoaYh4FdunDoKli8aMrff3e24UyE7VRkFaMMsLIne5ioX5yTqolnd9h2jy7HkJ3gmyAxyJHXTaLKBNOeCH-5AmR-54Rb3UWpVaNG9BMfjqlX5_84nljhP9zTdqqw8rYouoI5KexvI23sen_IThC1y4NpKnemFNAPWebtt87jC410hIu9L6H34KX-RW6Ydcf_yJTKzdRWmRcG8-eoDL3mQcRcs8vaaj83wln3Np7pezGXra',
  },
  {
    id: 'user_2',
    rank: 2,
    name: 'Rohan_88',
    level: 26,
    xp: 12450,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEkcNNslVO79TCPA2caIiJbXL_RYI8Z2Ec0z27I_1hMaAghRet8lV4VQPw7ApxQPmk8hcyTpmxAmimnegr_FZtzpk-PpM9bn7QOCfDDeFcE61HPBpisrVkNOywGzU4tU-M5rkpuLKD3aFXL2CzilByImtQkPN95ztVBhAYJ3eyt4jIDXlKRjtSUqaUWoOeXW_cKPsojShRi04RxV3vDTHBOieh_J_HmgC9BKSXD6dOoZOQzlZpSRmp',
  },
  {
    id: 'user_3',
    rank: 3,
    name: 'QuestMaster',
    level: 25,
    xp: 11100,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmiwab829MyLp0Ky1XvTyhwbcSoplg-jyUVviY5kxi7kXBgTWqYbHzPDTeE97YMzKSyBX321OWqEyH0cv6XRnF2OMaTOExuCwKxHfI6XWIbZghhXwWRFSYyiCXBiIWamXLmJIYgoIdmnnVOOdBdcKDN-P4b7JADxfiN67PujlXomj0NP6nTi5z3HGLKK3BUZEFemf1yha4JlNWvsnsYO3rCzpI9TzNrcxocTtTPdYnqtwl_x94v23X',
  },
  // --- LIST USERS (Rank 4+) ---
  {
    id: 'user_4',
    rank: 4,
    name: 'YetiTracker',
    level: 24,
    xp: 10850,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv4Cugrh1NC6feWQUYwBqlEFpfgg2oJmj_JDmp5V4Tg0zTUBLABvw3ruaVRlIptdopR_9wLu_rI6asXLsLBz8gCoPnITvnCYrLUrzJkfvFQaaBcgUimfrOShZojrE6AN4ugtoVm2xNsDzqQbmSai4nD64zbc-x_iq9KeXUjy5EuJBgqrPMRmSyFQSxnj0Ld42p8ERIb6Yp-tCfufWZzvdBjnJMS5aWQHVPQSOSwkG70jLNSAL92eKP',
  },
  {
    id: 'user_5',
    rank: 5,
    name: 'KathmanduKid',
    level: 22,
    xp: 9400,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-QvsDW1vdMunvON-NqBGw2fNKuz2fk4ya04kgRkd3v4ZmAsQZGc5sReiqYr7yw_SA5YNwVvgdrp9FxbAWVHY5J6J7xabO-InW8Oi_MikZlr5EKOX_nMuoJE_lPXp9Z8OlTSWlKgDpkEwnt_-SBvmRXrnCSOH67h4BUI1d_T_6OM1iwW41IsOTXd8jZAtXyIGuzWzkpXCgsJUu1cUQH5J9aPVc9mDFMRr-txq2pUVWNOQ0Px7NwlX6',
  },
  {
    id: 'user_6',
    rank: 6,
    name: 'TempleRunner',
    level: 21,
    xp: 8900,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAF4WyFbrakig3anM4lE7YXMglttEETOlSpmWiG6XyUwBhzb5qUPXnVh8rZ5lxUJiqVy9RRrvy0ipauwvSt1ewGrWY40c5tNTWgLWL3DKufvrGW6eYK9TAjijqDIQlIlXKsCXyIhKt2HSd8t8V0tX7mIfiF82hBglFsSnG2K20_Ng4Hn-mVTTjclQRscJ0c_AtpyU1gxG2nKyjjlHL6CBYbtNIxWkFJC1h9kWFDRF28Ko61Xw-1L0i',
  },
  {
    id: 'user_42',
    rank: 42,
    name: 'HeritageHunter_23',
    level: 12,
    xp: 1800,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FxffOB-5UQIplOOovIJZx9heOZshTMV6-M1yOkOlzxxS5DDDZnq3J7CBmPv4mx5G3Sjd66upIpEwhrAXO1j1mhzDOH5eG-iybc91Zs8-PFhJehL5E_hJp2nnP8Go3HVNw85qUvmU3JK3q3BaNCWxEZgjm-hywXoFVziJ45lD-Y2Vpm9sz_41xhgxwKkH2L-5XRwCiLdC3EBKpB22mee2b72fsww1VezekHa4T_1duk9b6icLcna9',
    isCurrentUser: true,
  },
];