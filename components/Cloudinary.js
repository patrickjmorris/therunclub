import { Component } from "react";
import Script from "next/script";

export default class CloudinaryUploadWidget extends Component {
  constructor(props) {
    super(props);
    this.uploader = null;
  }

  showWidget = () => {
    const { callback } = this.props;
    let widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "vercel-platforms",
        uploadPreset: "w0vnflc6",
        cropping: true,
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          callback(result.info);
        }
      }
    );
    widget.open();
  };

  open = (e) => {
    e.preventDefault();
    this.showWidget();
  };

  render() {
    return (
      <>
          <Script
            src="https://widget.cloudinary.com/v2.0/global/all.js"
          ></Script>
        
        {this.props.children({ open: this.open })}
      </>
    );
  }
}
