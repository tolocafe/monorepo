export default function WebContent(props: {
	source: undefined | { html: string }
}) {
	return <div dangerouslySetInnerHTML={{ __html: props.source?.html ?? '' }} />
}
