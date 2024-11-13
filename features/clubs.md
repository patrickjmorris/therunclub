Certainly! Below is a detailed specification for implementing the feature of extracting and storing running club information using the OpenAI API in your existing project. The stack you'll be using includes Next.js 15, TypeScript, Supabase, and Drizzle ORM.

---

## **Feature Specification: Running Club Information Extraction and Storage**

### **Objective**

Implement a feature that extracts structured information about running clubs from unstructured text using the OpenAI API and stores it in your Supabase database using Drizzle ORM.

### **Components**

1. **Data Extraction**: Use the OpenAI API to parse unstructured text and extract structured data about running clubs.
2. **Data Storage**: Store the extracted data in your Supabase PostgreSQL database using Drizzle ORM.
3. **Integration**: Incorporate the feature into your existing Next.js application, ensuring seamless user experience.

---

## **Detailed Implementation Plan**

### **1. Data Extraction Using OpenAI API**

#### **1.1. Set Up OpenAI API Client**

- **Install OpenAI SDK**: Add the OpenAI Node.js client to your project dependencies.

  ```
  bun add openai
  ```

- **Configure API Key**: Securely store your OpenAI API key using environment variables.

  - Create an `.env.local` file at the root of your project.
  - Add `OPENAI_API_KEY=your_openai_api_key`.

- **Initialize the Client**: In your application, initialize the OpenAI client using the API key from environment variables.

#### **1.2. Define the Data Structure**

- **Data Fields to Extract**:

  - Club Name (`string`)
  - Location (`string`)
  - Website URL (`string`)
  - Description (`string`)
  - Social Media Links (`object`):

    - Facebook (`string`)
    - Instagram (`string`)
    - Twitter (`string`)

  - Strava Link (`string`)

- **Function Calling Feature**: Use OpenAI's function calling capability to extract these fields.

  - Define a function schema that specifies the expected output structure.
  - Include descriptions for each field to improve extraction accuracy.

#### **1.3. Craft the Prompt**

- **Instruction Prompt**: Create a clear and concise prompt that instructs the model to extract the required information.

  - Example:

    ```
    Extract the following information about the running club from the text below:
    - Club Name
    - Description
    - Location
    - Website Link
    - Social Media Links (Facebook, Instagram, Twitter)
    - Strava Link
    If any information is not available, return null for that field.
    Text:
    [Insert unstructured text here]
    ```

#### **1.4. API Call Implementation**

- **Make an API Request**: Send a request to the OpenAI API with the crafted prompt and function definition.

- **Handle the Response**:

  - Check if the response includes a function call with the extracted data.
  - Parse the arguments to obtain the structured data.

### **2. Data Storage with Supabase and Drizzle ORM**

#### **2.1. Define the Database Schema**

- **Create a Table for Running Clubs**:

  - Table Name: `running_clubs`
  - Columns:

    - `id` (Primary Key)
    - `club_name` (`string`, required)
    - `description` (`string`, nullable)
    - `location` (`string`, nullable)
    - `website` (`string`, nullable)
    - `facebook` (`string`, nullable)
    - `instagram` (`string`, nullable)
    - `twitter` (`string`, nullable)
    - `strava_link` (`string`, nullable)

- **Migration**: Use Drizzle ORM to define the schema and run migrations to create the table in Supabase.

#### **2.2. Configure Drizzle ORM**

- **Define Models**:

  - Create a TypeScript model for the `running_clubs` table.
  - Use Drizzle ORM's schema definition methods to map the database columns to TypeScript types.

#### **2.3. Implement Data Insertion**

- **Create a Repository or Service Layer**:

  - Implement functions to insert new records into the `running_clubs` table.
  - Ensure that data types and nullability match the database schema.

- **Error Handling**:

  - Implement try-catch blocks to handle any database errors.
  - Validate data before insertion to prevent exceptions.

### **3. Integration into Next.js Application**

#### **3.1. API Route Creation**

- **Create an API Endpoint**:

  - Path: `/api/extract-club-info`
  - Method: `POST`
  - Purpose: Receive unstructured text, process it using OpenAI API, and store the extracted data.

- **Endpoint Logic**:

  1. **Receive Request**:

     - Accept unstructured text data in the request body.

  2. **Data Extraction**:

     - Invoke the OpenAI API client with the provided text and function schema.
     - Parse the response to get structured data.

  3. **Data Storage**:

     - Use the service layer to insert the extracted data into the database.
     - Handle any validation or insertion errors.

  4. **Response**:

     - Return a success message along with the stored data.
     - In case of errors, return an appropriate error message.

#### **3.2. Frontend Implementation**

- **User Interface**:

  - **Form**:

    - A textarea or input field for users to paste or enter unstructured text about running clubs.
    - A submit button to trigger the extraction process.

  - **Feedback**:

    - Display a loading indicator while processing.
    - Show the extracted data after successful extraction and storage.
    - Display error messages if any step fails.

- **API Interaction**:

  - Use `fetch` or a library like `axios` to send a POST request to the API endpoint.
  - Handle responses and update the UI accordingly.

#### **3.3. Routing and Navigation**

- **Add a New Page**:

  - Path: `/add-club` or similar.
  - Include the form and necessary UI components.

- **Update Navigation**:

  - If applicable, add links to the new page in your application's navigation menu.

### **4. Testing and Validation**

#### **4.1. Unit Tests**

- **API Endpoint Tests**:

  - Mock OpenAI API responses to test the endpoint logic.
  - Test successful data extraction and storage.
  - Test error handling for various failure scenarios.

#### **4.2. Integration Tests**

- **End-to-End Testing**:

  - Use a tool like Cypress to simulate user interaction.
  - Verify that unstructured text input leads to correct data being stored in the database.

#### **4.3. Data Validation**

- **Input Sanitization**:

  - Ensure that the unstructured text is properly sanitized before processing.

- **Output Verification**:

  - Manually verify a few entries to ensure data accuracy.
  - Cross-reference extracted data with the original unstructured text.

### **5. Additional Considerations**

#### **5.1. Error Handling and User Feedback**

- **User-Friendly Messages**:

  - Display clear messages for both successes and failures.
  - Avoid exposing technical details to the end-user.

- **Logging**:

  - Implement server-side logging for errors and important events.
  - Consider using a logging service for better monitoring.

#### **5.2. Security Practices**

- **Environment Variables**:

  - Ensure that sensitive information like API keys and database URLs are stored securely.
  - Do not expose these variables in client-side code.

- **API Key Protection**:

  - Keep the OpenAI API key secure and rotate it periodically.

#### **5.3. Performance Optimization**

- **Asynchronous Processing**:

  - Since API calls to OpenAI can take time, ensure that the server remains responsive.
  - Use asynchronous functions and handle promises properly.

- **Rate Limiting**:

  - Be mindful of OpenAI's rate limits.
  - Implement checks to prevent exceeding the allowed number of requests.

#### **5.4. Scalability**

- **Database Indexing**:

  - Add indexes to database columns that are frequently queried.

- **Modular Code Structure**:

  - Organize code into modules or services for better maintainability.

#### **5.5. Compliance and Legal**

- **Terms of Service**:

  - Ensure compliance with OpenAI's policies regarding data usage.

- **Privacy Regulations**:

  - Be aware of GDPR or other data protection regulations if handling personal data.

#### **5.6. Future Enhancements**

- **Automated Data Collection**:

  - Integrate web scraping tools (while respecting robots.txt and terms of service) to gather unstructured text data automatically.

- **User Contributions**:

  - Allow authenticated users to submit running club information directly.

- **Data Verification**:

  - Implement a moderation system to verify and approve user-submitted data.

---

## **Summary for the Developer**

- **Objective**: Implement a feature to extract and store running club information from unstructured text.

- **Technologies**:

  - **Frontend**: Next.js 15 with TypeScript.
  - **Backend**: Next.js API routes.
  - **Database**: Supabase (PostgreSQL).
  - **ORM**: Drizzle ORM.
  - **External API**: OpenAI API with function calling feature.

- **Steps**:

  1. **Set Up OpenAI API Client**: Install and configure the OpenAI Node.js client in the project.
  2. **Define Data Models**: Use Drizzle ORM to define the `running_clubs` table schema.
  3. **Implement API Endpoint**: Create an API route that accepts unstructured text, processes it using OpenAI, and stores the result.
  4. **Integrate Frontend**: Build a page with a form for users to submit unstructured text and view results.
  5. **Testing**: Write unit and integration tests to ensure reliability.
  6. **Deployment**: Ensure environment variables are set appropriately in production environments.

- **Considerations**:

  - **Error Handling**: Provide meaningful error messages and handle exceptions gracefully.
  - **Security**: Protect API keys and sensitive data; ensure compliance with relevant policies.
  - **Performance**: Optimize API calls and database interactions; consider asynchronous processing.

---

## **Action Items**

- **Set Up Environment**:

  - Ensure that the OpenAI API key and Supabase credentials are correctly set in environment variables.

- **Implement Backend Logic**:

  - Configure the OpenAI client and define the function schema.
  - Create the Drizzle ORM models and run migrations.
  - Develop the API route with the extraction and storage logic.

- **Develop Frontend Interface**:

  - Create the submission form and handle user interactions.
  - Connect the frontend to the backend API.

- **Testing**:

  - Write tests for both frontend and backend components.
  - Manually test the feature with sample data.

- **Review and Deploy**:

  - Conduct a code review to ensure best practices.
  - Deploy the updated application to your hosting environment.

---

## **Resources**

- **OpenAI API Documentation**:

  - Function Calling: [OpenAI Function Calling](https://platform.openai.com/docs/guides/gpt/function-calling)

- **Drizzle ORM Documentation**:

  - [Drizzle ORM GitHub](https://github.com/drizzle-team/drizzle-orm)

- **Supabase Documentation**:

  - [Supabase Docs](https://supabase.io/docs)

- **Next.js Documentation**:

  - [Next.js Docs](https://nextjs.org/docs)

---

## **Conclusion**

By following this specification, a developer should be able to implement the feature of extracting running club information from unstructured text and storing it in the database, using your existing tech stack. This feature will enhance your application by allowing users to easily contribute information and enrich the running community data available.