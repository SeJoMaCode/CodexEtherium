class SetTranslationsModel {
  final String? language;
  final String? setCode;
  final String? translation;

  SetTranslationsModel({
    this.language,
    this.setCode,
    this.translation,
  });

  factory SetTranslationsModel.fromMap(Map<String, dynamic> map) {
    return SetTranslationsModel(
      language: map['language'] as String?,
      setCode: map['setCode'] as String?,
      translation: map['translation'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'language': language,
      'setCode': setCode,
      'translation': translation,
    };
  }
}