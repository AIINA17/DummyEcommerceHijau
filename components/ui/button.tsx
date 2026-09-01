import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Ukuran & bobot mengikuti tokopedia.com: tombol setinggi 40px, teks 14px
// weight 700, radius 8px. CTA utama naik ke 48px.
// Transisi 200ms — di bawah 280ms yang terukur di situs asli.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-bold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover",
        outline:
          "border-brand-border bg-white text-brand hover:border-brand hover:bg-brand-soft",
        neutral:
          "border-line bg-white text-ink hover:border-ink-muted/40 hover:bg-ground",
        secondary: "bg-ground text-ink hover:bg-line",
        ghost: "text-ink hover:bg-ground",
        destructive:
          "bg-sale text-white hover:brightness-95 focus-visible:ring-sale/40",
        link: "font-bold text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-[14px]",
        sm: "h-9 px-3 text-[13px]",
        xs: "h-7 rounded-md px-2 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `render` datang dari Base UI: `<Button render={<Link href="/cart" />}>`
 * membuat tombol tampil sebagai anchor tanpa membungkus elemen tambahan.
 *
 * Base UI defaultnya `nativeButton = true` dan berasumsi elemen yang dirender
 * tetap `<button>`. Begitu `render` diisi elemen lain (mis. `<Link>` → `<a>`),
 * Base UI mendeteksi ketidakcocokan itu dan mencetak warning ke console. Kalau
 * `render` dipakai, defaultkan `nativeButton` ke `false` — pemanggil masih
 * bisa override kalau memang membungkus elemen `<button>` sungguhan.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={nativeButton ?? !props.render}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
