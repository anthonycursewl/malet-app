import Svg, { Path, SvgProps } from "react-native-svg";

export default function IconArrow(props: SvgProps) {
    return (
        <Svg
            fill="none"
            viewBox="0 0 24 24"
            {...props}
        >
            <Path
                fill="#0F0F0F"
                d="M5.707 9.71a1 1 0 0 0 0 1.415l4.892 4.887a2 2 0 0 0 2.828 0l4.89-4.89a1 1 0 1 0-1.414-1.415l-4.185 4.186a1 1 0 0 1-1.415 0L7.121 9.71a1 1 0 0 0-1.414 0Z"
            />
        </Svg>
    )
}