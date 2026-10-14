  export const developmentLinks = [
    { title: 'Github', url: 'https://github.com/moerdgid/', icon: 'code' },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com/', icon: 'layers' }
  ] as const

  export const entertainmentLinks = [
    { title: 'Disney+', url: 'https://www.disneyplus.com', icon: 'clapperboard' },
    { title: 'Youtube', url: 'https://www.youtube.com', icon: 'playcircle' }
  ] as const

  export const categories = [
    { title: 'Development', links: developmentLinks },
    { title: 'Entertainment', links: entertainmentLinks }
  ]