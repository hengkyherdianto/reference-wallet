// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import { FullTheme } from "react-native-elements";
import { TextStyle, ViewStyle } from "react-native";
import { PickerStyle } from "react-native-picker-select";

interface AppTheme extends Partial<FullTheme> {
  Screen: ViewStyle;
  ScrollArea: ViewStyle;
  ScrollAreaContent: ViewStyle;
  Container: ViewStyle;
  SmallContainer: ViewStyle;
  Section: ViewStyle;
  ExampleSection: ViewStyle;
  ExampleSectionText: TextStyle;
  ErrorMessage: ViewStyle;
  InfoMessage: ViewStyle;
  InputGroup: {
    containerStyle: ViewStyle;
    inputContainerStyle: ViewStyle;
    inputStyle: ViewStyle;
  };
  InputErrorMessage: TextStyle;
  SelectDropdown: {
    selectStyle: PickerStyle;
    selectNoStyle: PickerStyle;
  };
  CheckBoxText: TextStyle;
  ButtonsGroup: {
    containerStyle: ViewStyle;
    buttonStyle: ViewStyle;
  };
  PrimaryLink: TextStyle;
  SmallLink: TextStyle;
  Title: TextStyle;
  SubTitle: TextStyle;
}

export const appTheme: AppTheme = {
  colors: {
    primary: "#000",
    success: "#4caf50",
    error: "#ff331f",
  },
  Header: {
    containerStyle: {
      backgroundColor: "white",
      borderTopWidth: 3,
      borderTopColor: "#6d40ed",
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
      height: 64,
      paddingTop: 0,
    },
  },
  Text: {
    h1Style: {
      color: "#000",
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 16,
    },
    style: {
      color: "#75767f",
      lineHeight: 22,
      fontSize: 16,
    },
  },
  Screen: {
    height: "100%",
  },
  ScrollArea: {
    backgroundColor: "white",
  },
  ScrollAreaContent: {
    //
  },
  Container: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  SmallContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  Section: {
    marginBottom: 16,
  },
  ExampleSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#000",
    alignItems: "center",
  },
  ExampleSectionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ErrorMessage: {
    borderWidth: 1,
    borderColor: "#ff331f",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  InfoMessage: {
    borderWidth: 1,
    borderColor: "#96a8fc",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  InputGroup: {
    containerStyle: {
      width: "100%",
      backgroundColor: "#eff1f3",
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    inputContainerStyle: {
      flexDirection: "row",
      alignItems: "center",
    },
    inputStyle: {
      alignSelf: "center",
      flex: 1,
      padding: 0,
    },
  },
  Input: {
    containerStyle: {
      paddingHorizontal: 0,
      marginBottom: 0,
    },
    inputContainerStyle: {
      borderBottomWidth: 0,
      backgroundColor: "#eff1f3",
      borderRadius: 8,
    },
    inputStyle: {
      color: "#000",
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      lineHeight: 18,
      minHeight: undefined,
    },
    placeholderTextColor: "#75767f",
    leftIconContainerStyle: {
      height: undefined,
      paddingLeft: 8,
      paddingRight: 0,
      marginVertical: 0,
      marginRight: 8,
    },
    rightIconContainerStyle: {
      height: undefined,
      paddingLeft: 0,
      paddingRight: 8,
      marginVertical: 0,
      marginRight: 8,
    },
  },
  InputErrorMessage: {
    color: "#ff331f",
    fontSize: 12,
  },
  SelectDropdown: {
    selectStyle: {
      placeholder: {
        color: "#75767f",
        fontSize: 16,
        lineHeight: 18,
      },
      viewContainer: {
        backgroundColor: "#eff1f3",
        borderRadius: 8,
      },
      inputAndroidContainer: {
        padding: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      inputAndroid: {
        fontSize: 16,
        lineHeight: 18,
        color: "#000000",
      },
      inputIOSContainer: {
        padding: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      inputIOS: {
        fontSize: 16,
        lineHeight: 18,
        color: "#000000",
      },
    },
    selectNoStyle: {
      viewContainer: {},
      placeholder: {
        color: "#75767f",
        fontSize: 16,
        lineHeight: 18,
      },
      inputAndroid: {
        height: 48,
        fontSize: 16,
        lineHeight: 18,
        color: "#000000",
      },
      inputIOS: {
        fontSize: 16,
        lineHeight: 18,
        color: "#000000",
      },
    },
  },
  CheckBox: {
    wrapperStyle: {
      margin: 0,
      marginVertical: 8,
    },
    containerStyle: {
      margin: 0,
      padding: 0,
      marginLeft: 0,
      marginRight: 0,
      borderWidth: 0,
      backgroundColor: "none",
    },
  },
  CheckBoxText: {
    marginLeft: 8,
  },
  ButtonsGroup: {
    containerStyle: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      paddingHorizontal: 8,
    },
    buttonStyle: {
      flexGrow: 1,
      margin: 8,
    },
  },
  Button: {
    buttonStyle: {
      margin: 0,
      padding: 8,
      borderRadius: 8,
    },
    titleStyle: {
      fontSize: 16,
      lineHeight: 18,
      fontWeight: "bold",
      paddingTop: 0,
      paddingBottom: 0,
    },
    icon: {
      iconStyle: {
        color: "white",
      },
    },
  },
  PrimaryLink: {
    color: "#506efa",
  },
  SmallLink: {
    fontSize: 12,
    color: "#75767F",
  },
  Title: {
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 28,
    color: "#000000",
  },
  SubTitle: {
    fontSize: 20,
    lineHeight: 20,
  },
};