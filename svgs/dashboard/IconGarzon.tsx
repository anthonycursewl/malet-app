import Svg, { Path, SvgProps } from "react-native-svg";

interface IconGarzonProps extends SvgProps {
    fill?: string;
}

export default function IconGarzon({ fill = "#313131ff", ...props }: IconGarzonProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...props}>
            {/* Restaurant/Waiter icon - represents a serving cloche */}
            <Path
                d="M12 2C6.48 2 2 6.48 2 12C2 14.24 2.78 16.3 4.08 17.92L4 18H20L19.92 17.92C21.22 16.3 22 14.24 22 12C22 6.48 17.52 2 12 2Z"
                stroke={fill}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M4 18H20V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V18Z"
                stroke={fill}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M12 2V6"
                stroke={fill}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M10 6H14"
                stroke={fill}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
