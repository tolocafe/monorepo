export default function WebContent(props: {
	source: undefined | { html: string }
}) {
	// oxlint-disable-next-line no-danger
	return <div dangerouslySetInnerHTML={{ __html: props.source?.html ?? '' }} />
}
