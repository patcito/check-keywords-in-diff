export type Args = {
  branch: string;
  notifications?: {
    token: string;
    label?: string;
    issue: boolean;
    check: boolean;
  };
};

export enum Tolerance {
  Better = 'better',
  MixedBetter = 'mixed-better',
  Same = 'same',
  Mixed = 'mixed',
  MixedWorse = 'mixed-worse',
  Worse = 'worse',
}

export enum Mode {
  Addition = 'addition',
  Deletion = 'deletion',
}
