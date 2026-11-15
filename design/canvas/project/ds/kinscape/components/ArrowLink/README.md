A text and the forward icon, in the link font with no underline.

## Design

- **Arrow link:** a text and the forward icon (16px, 4px gap) in `type.link`, with no underline. With an `href` it is a link: hover `--brand-hover`, pressed `--brand-pressed`, focus the ring. Without one it is a label for a row that is one link, and it turns `--brand-pressed` while that link is pressed.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |
| `href` | `string` | no |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

It takes one of these forms. Required props: none; or `href`.

The other attributes of its HTML element go to the element.
