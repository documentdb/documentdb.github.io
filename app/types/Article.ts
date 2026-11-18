export interface Article {
  landing: {
    title: string;
    description: string;
    links: Array<{
      title: string;
      link: string;
    }>;
    /** Secondary meta links (release notes, versions) shown below the section grid. */
    secondaryLinks?: Array<{
      title: string;
      description?: string;
      link: string;
    }>;
  };
}