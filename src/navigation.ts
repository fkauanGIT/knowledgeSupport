/** Application sections. Single source of truth for the sidebar and header. */
export type Section = 'home' | 'tickets' | 'standards' | 'documentation' | 'gaps' | 'config'

export interface NavItem {
  id: Section
  title: string
  subtitle: string
}

export const NAV: NavItem[] = [
  { id: 'home', title: 'Home', subtitle: 'Overview of the knowledge base' },
  { id: 'tickets', title: 'Tickets', subtitle: 'Jira tickets, analysis and feedback' },
  { id: 'standards', title: 'Standards', subtitle: 'Known errors and their solutions' },
  {
    id: 'documentation',
    title: 'Documentation',
    subtitle: 'Manuals indexed for search during analysis',
  },
  { id: 'gaps', title: 'Gaps', subtitle: 'Where a Standard is still missing' },
  { id: 'config', title: 'Settings', subtitle: 'API connection and Jira token' },
]
