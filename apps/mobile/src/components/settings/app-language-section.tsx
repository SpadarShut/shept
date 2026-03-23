import { useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  type ListRenderItemInfo,
} from "react-native"
import i18next from "i18next"
import { useTranslation } from "react-i18next"
import { systemLng } from "../../i18n"
import type { SheptSettings } from "../../stores/settings-store"
import { styles } from "./settings-styles"

interface AppLanguageSectionProperties {
  appLanguage: SheptSettings["appLanguage"]
  onChange: (value: SheptSettings["appLanguage"]) => void
}

const OPTIONS: Array<{
  value: SheptSettings["appLanguage"]
  labelKey: string
}> = [
  { value: "system", labelKey: "settings.appLanguageSystem" },
  { value: "en", labelKey: "settings.appLanguageEnglish" },
  { value: "be", labelKey: "settings.appLanguageBelarusian" },
]

export function AppLanguageSection({
  appLanguage,
  onChange,
}: AppLanguageSectionProperties) {
  const { t: tr } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<View>(null)
  const [dropdownTop, setDropdownTop] = useState(0)

  const selectedLabel =
    OPTIONS.find((o) => o.value === appLanguage)?.labelKey ??
    OPTIONS[0].labelKey

  const handleSelect = (value: SheptSettings["appLanguage"]) => {
    onChange(value)
    const lng = value === "system" ? systemLng : value
    i18next.changeLanguage(lng).catch(() => {})
    setOpen(false)
  }

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((_x, y, _w, h) => {
      setDropdownTop(y + h + 4)
      setOpen(true)
    })
  }

  const renderItem = ({
    item,
  }: ListRenderItemInfo<(typeof OPTIONS)[number]>) => {
    const isActive = item.value === appLanguage
    return (
      <TouchableOpacity
        style={[dropdownStyles.item, isActive && dropdownStyles.itemActive]}
        onPress={() => handleSelect(item.value)}
      >
        <Text
          style={[
            dropdownStyles.itemText,
            isActive && dropdownStyles.itemTextActive,
          ]}
        >
          {tr(item.labelKey)}
        </Text>
        {isActive && <Text style={dropdownStyles.check}>✓</Text>}
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        {tr("settings.appLanguage")}
      </Text>

      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity style={dropdownStyles.trigger} onPress={openDropdown}>
          <Text style={dropdownStyles.triggerText}>{tr(selectedLabel)}</Text>
          <Text style={dropdownStyles.arrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={dropdownStyles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={[dropdownStyles.menu, { top: dropdownTop }]}>
            <FlatList
              data={OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

import { StyleSheet } from "react-native"

const dropdownStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  triggerText: {
    fontSize: 16,
    color: "#333",
  },
  arrow: {
    fontSize: 12,
    color: "#999",
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemActive: {
    backgroundColor: "#f0f4ff",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  itemTextActive: {
    fontWeight: "600",
  },
  check: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
})
