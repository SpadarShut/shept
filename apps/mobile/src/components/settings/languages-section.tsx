import { useState } from "react"
import { Text, TextInput, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"
import { LANGUAGES } from "../../constants/languages"
import { styles } from "./settings-styles"

interface LanguagesSectionProperties {
  languages: string[]
  onToggle: (code: string) => void
}

export function LanguagesSection({
  languages,
  onToggle,
}: LanguagesSectionProperties) {
  const { t: tr } = useTranslation()
  const [langSearch, setLangSearch] = useState("")

  const filteredLangs = LANGUAGES.filter((language) =>
    language.name.toLowerCase().includes(langSearch.toLowerCase()),
  )

  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        {tr("settings.languages")}
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder={tr("settings.searchLanguages")}
        placeholderTextColor="#999"
        value={langSearch}
        onChangeText={setLangSearch}
      />
      {filteredLangs.map((item) => {
        const selected = languages.includes(item.code)
        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.langRow, selected && styles.langRowSelected]}
            onPress={() => onToggle(item.code)}
          >
            <Text
              style={[styles.langText, selected && styles.langTextSelected]}
            >
              {item.name}
            </Text>
            {selected && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        )
      })}
    </>
  )
}
