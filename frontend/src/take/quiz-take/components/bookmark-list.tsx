import './bookmark-list.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'

interface BookmarkListProps {
    readonly bookmarks: { title: string; onClick: () => void; onDelete: () => void }[]
}

export const BookmarkList = ({ bookmarks }: BookmarkListProps) => {
    const { t } = useLanguage()
    const isEmpty = bookmarks.length === 0
    return (
        <aside className={`bookmark-list${isEmpty ? ' is-empty' : ''}`} data-testid="bookmark-list">
            {!isEmpty && <h2 className="title">{t.take.bookmarkedQuestionsTitle}</h2>}
            <ul>
                {bookmarks.map(bookmark => (
                    <li key={bookmark.title}>
                        <button type="button" className="entry" onClick={bookmark.onClick}>
                            <span className="icon" aria-hidden="true">
                                ★
                            </span>
                            <span className="entry-title">{bookmark.title}</span>
                        </button>
                        <button
                            type="button"
                            className="remove"
                            aria-label={`delete-bookmark-${bookmark.title}`}
                            data-testid={`delete-bookmark-${bookmark.title}`}
                            onClick={bookmark.onDelete}
                            title={t.take.removeBookmarkTitle}
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    )
}
