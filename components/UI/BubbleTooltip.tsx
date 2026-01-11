import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import type { MapItem } from "./MapWithPins";

type Props = {
  item: MapItem;
  anchor: { x: number; y: number };
  onClose: () => void;
  onDetails: () => void;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function BubbleTooltip({
  item,
  anchor,
  onClose,
  onDetails,
}: Props) {
  const { width: screenW } = Dimensions.get("window");
  const [size, setSize] = React.useState<{ w: number; h: number }>({
    w: 320,
    h: 160,
  });

  const MARGIN = 10;
  const GAP = 20;
  const ARROW_H = 10;

  let bubbleLeft = anchor.x - size.w / 2;
  bubbleLeft = clamp(bubbleLeft, MARGIN, screenW - MARGIN - size.w);

  let bubbleTop = anchor.y - (size.h + GAP + ARROW_H);
  const minTop = MARGIN + 70;
  let below = false;
  if (bubbleTop < minTop) {
    bubbleTop = anchor.y + GAP + ARROW_H;
    below = true;
  }

  const arrowLeft = clamp(anchor.x - bubbleLeft - 10, 16, size.w - 16 - 20);

  const handleDetailsPress = () => {
    onClose();
    onDetails();
  };

  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[styles.wrap, { left: bubbleLeft, top: bubbleTop }]}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (
            Math.abs(width - size.w) > 0.5 ||
            Math.abs(height - size.h) > 0.5
          ) {
            setSize({ w: width, h: height });
          }
        }}
      >
        <View style={styles.bubble}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.desc} numberOfLines={2}>
            {item.foundLocation.description || item.description || ""}
          </Text>

          {!!item.dateFound && (
            <Text style={styles.meta}>
              Znaleziono:{" "}
              {dayjs(item.dateFound).locale("pl").format("D MMMM YYYY, HH:mm")}
            </Text>
          )}

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleDetailsPress}
          >
            <Text style={styles.btnText}>Szczegóły</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.arrow,
            {
              left: arrowLeft,
              top: below ? -ARROW_H : size.h,
              transform: below ? [{ rotate: "180deg" }] : [{ rotate: "0deg" }],
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute" },
  bubble: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 10,
  },
  title: { fontWeight: "800", fontSize: 22, marginBottom: 6 },
  desc: { color: "#444", fontSize: 16 },
  meta: { marginTop: 8, fontSize: 14, color: "#777" },
  btn: {
    marginTop: 12,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
});
