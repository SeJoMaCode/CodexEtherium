class MetaModel {
  final DateTime? date;
  final String? version;

  MetaModel({
    this.date,
    this.version,
  });

  factory MetaModel.fromMap(Map<String, dynamic> map) {
    DateTime? parsedDate;
    if (map['date'] != null) {
      parsedDate = DateTime.tryParse(map['date'] as String);
    }
    return MetaModel(
      date: parsedDate,
      version: map['version'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'date': date?.toIso8601String(),
      'version': version,
    };
  }
}