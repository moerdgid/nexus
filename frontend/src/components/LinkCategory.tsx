function LinkCategory(
    { title, links}:
    { title: string; links: { title: string; url: string }[] }
) {
    return (
        <div>
            <h2>{title}</h2>
            {links.map(link => <p key={link.url}><a href={link.url}>{link.title}</a></p>)}
        </div>
    )

}
export default LinkCategory