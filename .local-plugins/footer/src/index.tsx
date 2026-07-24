import type {
  QuartzComponent,
  QuartzComponentConstructor,
} from "@quartz-community/types"

const style = `
footer {
  text-align: left;
  margin-bottom: 4rem;
  opacity: 0.7;
}
`

const Footer = (() => {
  const FooterComponent: QuartzComponent = ({ displayClass }) => (
    <footer class={displayClass ?? ""}>
      <p>
        Created with{" "}
        <a href="https://github.com/yalezhangk/quartz">MKT Digital Team</a> &copy; 2026
      </p>
    </footer>
  )

  FooterComponent.css = style
  return FooterComponent
}) satisfies QuartzComponentConstructor

export default Footer
export { Footer }
