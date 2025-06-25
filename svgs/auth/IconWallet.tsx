import Svg, { G, Path, SvgProps } from 'react-native-svg'

export default function IconWallet({ ...props }: SvgProps) {
    return (
        <Svg
          fill="none"
          viewBox="0 0 24 24"
          {...props}
        >
          <G stroke="#0a0a0a">
            <Path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 8h4"
            />
            <Path
              strokeWidth={1.5}
              d="M20.833 9h-2.602C16.446 9 15 10.343 15 12s1.447 3 3.23 3h2.603c.084 0 .125 0 .16-.002.54-.033.97-.432 1.005-.933.002-.032.002-.071.002-.148v-3.834c0-.077 0-.116-.002-.148-.036-.501-.465-.9-1.005-.933C20.959 9 20.918 9 20.834 9Z"
            />
            <Path
              strokeWidth={1.5}
              d="M20.965 9c-.078-1.872-.328-3.02-1.137-3.828C18.657 4 16.771 4 13 4h-3C6.229 4 4.343 4 3.172 5.172 2 6.343 2 8.229 2 12c0 3.771 0 5.657 1.172 6.828C4.343 20 6.229 20 10 20h3c3.771 0 5.657 0 6.828-1.172.809-.808 1.06-1.956 1.137-3.828"
            />
            <Path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.991 12h.01"
            />
          </G>
        </Svg>
      )
}