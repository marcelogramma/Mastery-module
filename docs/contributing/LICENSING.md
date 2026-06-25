# Licensing

This document establishes the guidelines and best practices for creating and managing software licenses for all proprietary code produced by **the organization**. It ensures that the proprietary nature of the code is protected, and that licensing
terms are clearly defined and standardized across all projects. The **"Proprietary (Custom) License"** is the only allowed [SPDX](<https://spdx.dev/>) identifier for proprietary software created by **the organization** for its clients.

## License header format

All source code files MUST contain a standard license header that clearly identifies the project, the parties involved, and the proprietary nature of the code. The header MUST be placed at the top of each source file and follow the format outlined
below:

### Standard license headers

    /*
    * This file is part of the [CLIENT_NAME] - [PROJECT_NAME] project.
     *
    * (c) the organization <engineering@company.com>.
     *
    * This source code is proprietary and confidential. All rights reserved.
     *
    * This source file is subject to a proprietary license, which is bundled
    * with this source code in the LICENSE file. You may not distribute, modify,
    * or disclose this code except as expressly authorized by the organization
     *
    * SPDX-License-Identifier: Proprietary (Custom) License
     */

### Key components of the license header

* **[CLIENT_NAME] - [PROJECT_NAME]** : The name of the client and the project (e.g., ACME - Calculator).

* **the organization** : The software provider's name (i.e., the developer).

* **Contact information** : The contact email for the organization

* **Proprietary and confidential notice** : Indicates the proprietary and confidential nature of the software.

* **License notice** : Refers to the proprietary license in the `LICENSE` file and provides a clear restriction on distribution, modification, or disclosure.

* **SPDX-License-Identifier** : The SPDX identifier for the proprietary license, which is always **Proprietary (Custom) License**.

## Use of SPDX identifier

### SPDX identifier for Proprietary Software

For all proprietary software created by **the organization** , the **only valid SPDX identifier** to be used is:

    SPDX-License-Identifier: Proprietary (Custom) License

This identifier signifies that the software is proprietary, and it MUST NOT be distributed or modified without the express consent of **the organization**.

The **Proprietary (Custom) License** is not an official SPDX-approved identifier but is used internally to denote the proprietary nature of the code. This MUST be used in all source code files produced by **the organization** and referenced in the
`LICENSE` file.

### Prohibited SPDX identifiers

The use of any open-source SPDX identifiers (e.g., MIT, GPL) MUST NOT be used for proprietary code. The **"Proprietary (Custom) License"** is the **ONLY** allowed identifier for non-open-source software produced by **the organization**.

### Licenses in third party components

You MUST only include third party components that use the following SPDX license identifiers. Other licenses are not allowed. This restriction applies to direct and [transitive](<https://en.wikipedia.org/wiki/Transitive_dependency>) dependencies.

* [Apache License 2.0](<https://spdx.org/licenses/Apache-2.0.html>);

* [BSD 2-Clause License](<https://spdx.org/licenses/BSD-2-Clause.html>);

* [BSD 3-Clause License](<https://spdx.org/licenses/BSD-3-Clause.html>);

* [Creative Commons Zero (CC0-1.0)](<https://spdx.org/licenses/CC0-1.0.html>);

* [ISC License](<https://spdx.org/licenses/ISC.html>);

* [MIT License](<https://spdx.org/licenses/MIT.html>);

* [Microsoft Public License (MS-PL)](<https://spdx.org/licenses/MS-PL.html>);

* [Unlicense](<https://spdx.org/licenses/Unlicense.html>);

* [Zlib](<https://spdx.org/licenses/Zlib.html>).

In general, these licenses **require attribution** in the form of including copyright and license notices in the source code or binary redistributions. However, they **do not require public-facing attribution** (e.g., within the user interface or in
a publicly visible part of the application). This makes them suitable for integration into our proprietary software, where we MUST NOT expose third-party open-source copyright information to end-users directly.

## Licensing terms

All software developed by **the organization** is proprietary. The licensing terms MUST ensure the following:

### Ownership

**the organization** retains full ownership of the Software, including all source code, documentation, and any associated materials, unless explicitly agreed otherwise in writing.

The client MAY own the functional requirements of the Software, but the Software itself remains the intellectual property of **the organization** , unless the contract specifies otherwise.

### Usage rights

The client MAY be granted a license to use the Software under the terms specified in the applicable Statement of Work or Contract.

* **the organization** MUST clearly specify the scope of use (e.g., whether the client can deploy, modify, or redistribute the Software).

* The license **SHALL NOT** be transferred, sublicensed, or assigned without the prior written consent of **the organization**.

* The license MUST be used only for the purpose(s) specified in the Statement of Work or Contract.

### Modifications

* The client **MAY NOT** modify the source code unless specifically authorized by **the organization** in writing.

* If modifications are authorized, such modifications MAY remain the property of the client, but the underlying proprietary code SHALL remain owned by **the organization**.

### No redistribution

The client **MAY NOT** redistribute, resell, or transfer the Software to third parties without the express written consent of **the organization**.

### Confidentiality

The Software SHALL be treated as proprietary and confidential by the client, and the client MUST take reasonable steps to protect its confidentiality. The client MUST NOT disclose or share the Software with any third party without written permission
from **the organization** , except as required by law.

## License file

Each project MUST include a `LICENSE` file that provides the complete terms of the proprietary license. The `LICENSE` file SHALL contain the following:

* **License Summary** : A brief description of the proprietary license.

* **Grant of License** : Clear definitions of how the client can use, modify, and distribute the Software (if applicable).

* **Restrictions** : A list of restrictions on redistribution, modification, or reverse engineering.

* **Confidentiality** : A statement about the confidentiality of the code.

* **Contact Information** : How the client can contact **the organization** for inquiries related to the license.

The `LICENSE` file MUST reference the **Proprietary (Custom) License** and describe any special terms that apply to the particular project:

    # Proprietary (Custom) License Agreement

    This **Proprietary (Custom) License Agreement** ("Agreement") is entered into by and between **the organization**, a United States
    of America corporation ("Licensor"), and the client ("Licensee") named in the applicable Statement of Work or Contract Agreement
    (the "Client"), collectively referred to as the "Parties".

    ## Grant of license

    **the organization** grants to the Licensee a **non-exclusive**, **non-transferable** license to use the software identified in
    the accompanying documentation and source code (the "Software"), subject to the terms and conditions of this Agreement.

  * **License scope**: The Software may only be used for the purpose(s) specified in the applicable Statement of Work or Contract.
  * **Installation**: The Software may be installed and used only on the Licensee’s devices or systems within their organization.
  * **Modifications**: Licensee is not granted the right to modify, adapt, or create derivative works of the Software unless
      specifically authorized by **the organization** in writing.

    ## Restrictions

    The Licensee agrees to comply with the following restrictions:

  * **No redistribution**: The Software may not be redistributed, resold, or transferred to third parties without the express
      written consent of **the organization**.
  * **Confidentiality**: The Licensee agrees to treat the Software as proprietary and confidential, and will not disclose or
      share the Software with any third party, except to employees or contractors who have a need to know and are bound by similar
      confidentiality obligations.
  * **Reverse engineering**: The Licensee is prohibited from reverse engineering, de-compiling, or disassembling the Software.

    ## Ownership

  * **Intellectual Property**: The Software, including all source code, object code, documentation, and any associated materials,
      remains the exclusive property of **the organization** unless otherwise stated in a separate agreement.
  * **Client Ownership of Functional Requirements**: The Client may own the functional requirements of the Software, but the
      source code, architecture, and all technical aspects remain the intellectual property of **the organization** unless otherwise
      agreed upon in writing.

    ## Term and termination

  * **Term**: This license is effective as of the date the Licensee receives the Software and continues in effect until terminated
      as provided below.
  * **Termination for breach**: Either Party may terminate this Agreement upon written notice if the other Party breaches any
      material term of this Agreement and fails to cure such breach within thirty (30) days of receipt of notice.
  * **Effect of termination**: Upon termination, the Licensee must cease all use of the Software, destroy or return all copies
      of the Software, and certify in writing that they have done so.

    ## Maintenance and support

  * **Support**: Support and maintenance services may be provided under a separate support agreement. If such services are
      provided, they are subject to the terms of that agreement.
  * **Updates**: **the organization** may, at its discretion, provide updates to the Software. Such updates may be subject to the
      terms of this Agreement or a separate update agreement.

    ## Warranty disclaimer

  * **Warranty for maintenance period**: During the term of the maintenance and support services agreed upon between the Parties,
      **the organization** warrants that the Software will perform in accordance with the specifications defined in the applicable
      Statement of Work or Contract Agreement. If the Software fails to meet these specifications, **the organization** will, at its
      discretion, either correct the defect, replace the Software, or refund the license fee for the affected portion of the
      Software. This warranty applies only to the Software that is maintained by **the organization** during the maintenance period
      and is contingent upon the Licensee’s compliance with the terms of this Agreement.
  * **No warranty outside maintenance period**: Outside of the maintenance and support period, the Software is provided "as
      is," and **the organization** disclaims all warranties, express or implied, including but not limited to warranties of merchantability,
      fitness for a particular purpose, and non-infringement. Once the maintenance period expires or is terminated, no further
      warranty is provided.
  * **No liability**: Except for the warranty provided during the maintenance period, **the organization** will not be liable for
      any damages arising from the use or inability to use the Software, including but not limited to loss of data, lost profits,
      or other indirect, incidental, or consequential damages, even if **the organization** has been advised of the possibility of
      such damages.

    ## Confidentiality

    The Licensee acknowledges that the Software and all related documentation are confidential and proprietary to **the organization**
    The Licensee agrees to keep the Software confidential and not disclose it to any third parties without the express written
    consent of **the organization**, except to the extent required by law.

    ## General provisions

  * **Governing law**: This Agreement shall be governed by and construed in accordance with the laws of the United States of
      America, without regard to its conflicts of law principles.
  * **Dispute resolution**: Any disputes arising out of or in connection with this Agreement shall be resolved through [Arbitration/Mediation]
      in the United States of America, and the prevailing party shall be entitled to recover all reasonable costs, including
      attorney fees.
  * **Entire agreement**: This Agreement constitutes the entire agreement between the Parties regarding the subject matter
      hereof and supersedes all prior or contemporaneous agreements, understandings, or representations, whether oral or written.

    ## Contact information

    For inquiries about this license or any aspect of the Software, please contact:

    **the organization**

    Email: engineering@company.com

    Phone: +1 213 408 4675

    Website: the organization.com

## Compliance and enforcement

### Compliance

All team members involved in software development at **the organization** MUST ensure that the license headers and the SPDX identifier are correctly applied to all proprietary source code files. Non-compliance with this policy MAY result in legal
and operational consequences.

### Enforcement

**the organization** **RESERVES THE RIGHT** to enforce the terms of its proprietary licenses and MAY take appropriate legal action against unauthorized use, distribution, or modification of the Software.

## Conclusion

This policy ensures that all software produced by **the organization** is properly licensed and that the proprietary nature of the code is consistently protected. By following these guidelines, we maintain legal clarity and avoid any confusion
regarding the ownership and use the software we build.
