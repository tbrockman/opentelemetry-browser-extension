import {
  createTheme,
  Flex,
  MantineProvider,
} from "@mantine/core"


import "@mantine/core/styles.css"
import "./popup.css"
import LinkSection from "~components/LinkSection"
import Configuration from "~components/Configuration"

const theme = createTheme({
  /** Put your mantine theme override here */
  cursorType: 'pointer',
  components: {
    Fieldset: {
      styles: {
        legend: {
          paddingRight: '1rem'
        }
      }
    },
    TagsInput: {
      styles: {
        '&:disabled': {
          pill: {
            width: '300px !important', // or any other width you desire when the TagsInput is disabled
          }
        }
      }
    },
  }
})

function IndexPopup() {

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Flex className="popup-container" gap='md'>
        <Configuration />
        <LinkSection />
      </Flex>
    </MantineProvider>
  )
}

export default IndexPopup
