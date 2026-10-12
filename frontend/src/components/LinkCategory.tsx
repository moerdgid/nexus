import { Code2, Layers, Clapperboard, PlayCircle } from 'lucide-react'

const icons = {
    code: Code2,
    layers: Layers,
    clapperboard: Clapperboard,
    playcircle: PlayCircle
}

function LinkCategory(
    { title, links}:
    { title: string; links: { title: string; url: string; icon: keyof typeof icons }[] }
) {
    return (
        <div className="link-category">
            <h2>{title}</h2>

            <div className="category-links">

                {links.map(link => {
                    const Icon = icons[link.icon]

                    return (
                        <p key={link.url}>
                            <a href={link.url}>
                                <Icon size={32} />
                                {link.title}
                            </a>
                        </p>
                    )
            })}
            </div>
        </div>
    )

}
export default LinkCategory