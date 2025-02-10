class AndroidMetadataModel {
  final String? locale;

  AndroidMetadataModel({
    this.locale,
  });

  factory AndroidMetadataModel.fromMap(Map<String, dynamic> map) {
    return AndroidMetadataModel(
      locale: map['locale'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'locale': locale,
    };
  }
}